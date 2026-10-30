package com.agri.marketplace.security;

import com.agri.marketplace.entity.Crop;
import com.agri.marketplace.entity.Role;
import com.agri.marketplace.entity.User;
import com.agri.marketplace.repository.CropRepository;
import com.agri.marketplace.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
public class DataReconciliationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataReconciliationRunner.class);

    private final UserRepository userRepository;
    private final CropRepository cropRepository;
    private final PasswordEncoder passwordEncoder;

    public DataReconciliationRunner(UserRepository userRepository,
                                    CropRepository cropRepository,
                                    PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.cropRepository = cropRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        // 1. Ensure verified demo farmer account exists for safe ownership reconciliation
        User demoFarmer = userRepository.findByEmail("farmer@agrimarket.com")
                .orElseGet(() -> {
                    User farmer = new User();
                    farmer.setName("Ramesh Patel");
                    farmer.setEmail("farmer@agrimarket.com");
                    farmer.setPassword(passwordEncoder.encode("Farmer@123"));
                    farmer.setRole(Role.FARMER);
                    log.info("[RECONCILIATION] Created verified demo farmer account: farmer@agrimarket.com");
                    return userRepository.save(farmer);
                });

        // 2. Ensure initial administrator account exists (since public registration rejects ADMIN role)
        userRepository.findByEmail("admin@agrimarket.com")
                .orElseGet(() -> {
                    User admin = new User();
                    admin.setName("System Administrator");
                    admin.setEmail("admin@agrimarket.com");
                    admin.setPassword(passwordEncoder.encode("Admin@123"));
                    admin.setRole(Role.ADMIN);
                    log.info("[RECONCILIATION] Created default administrator account: admin@agrimarket.com");
                    return userRepository.save(admin);
                });

        // 3. Reconcile existing legacy crops that have no assigned farmer
        List<Crop> allCrops = cropRepository.findAll();
        int reconciledCount = 0;
        for (Crop crop : allCrops) {
            if (crop.getFarmer() == null) {
                crop.setFarmer(demoFarmer);
                cropRepository.save(crop);
                reconciledCount++;
            }
        }

        if (reconciledCount > 0) {
            log.info("[RECONCILIATION] Assigned {} legacy unassigned crop listings to verified farmer ({})",
                    reconciledCount, demoFarmer.getEmail());
        }
    }
}
